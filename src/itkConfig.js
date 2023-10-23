const itkConfig = {
    pipelineWorkerUrl: import.meta.env.BASE_URL + 'itk/web-workers/pipeline.worker.js',
    imageIOUrl: import.meta.env.BASE_URL + 'itk/image-io',
    meshIOUrl: import.meta.env.BASE_URL + 'itk/mesh-io',
    pipelinesUrl: import.meta.env.BASE_URL + 'itk/pipelines'
}

export default itkConfig